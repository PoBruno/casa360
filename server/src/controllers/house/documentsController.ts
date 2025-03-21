import type { Request, Response } from "express"
import DatabaseManager from "../../services/databaseManager"
import multer, { FileFilterCallback } from "multer"
import path from "path"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"

// Cria uma interface estendida para o Request com o campo "file"
interface MulterRequest extends Request {
  file?: Express.Multer.File
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const houseId = req.params.house_id
    const dir = path.join(__dirname, "../../../uploads", houseId)

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    cb(null, dir)
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Accept images, PDFs, and common document formats
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error("Only images, PDFs, and common document formats are allowed"))
    }
  },
}).single("document")

export const getAll = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query(`
      SELECT d.*, 
             COUNT(t.id) as task_count
      FROM documents d
      LEFT JOIN tasks t ON t.document_id = d.id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching documents:", error)
    res.status(500).json({
      message: "Error fetching documents",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    const result = await housePool.query("SELECT * FROM documents WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" })
    }

    const document = result.rows[0]

    // Get tasks associated with this document
    const tasksResult = await housePool.query(
      `
      SELECT t.id, t.entry_type, t.due_date, t.amount, t.description, t.status
      FROM tasks t
      WHERE t.document_id = $1
      ORDER BY t.due_date DESC
    `,
      [id],
    )

    res.json({
      ...document,
      tasks: tasksResult.rows,
    })
  } catch (error) {
    console.error("Error fetching document:", error)
    res.status(500).json({
      message: "Error fetching document",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const upload = async (req: Request, res: Response) => {
  const { house_id } = req.params

  uploadMiddleware(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }

    const multerReq = req as MulterRequest
    if (!multerReq.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    try {
      const dbManager = DatabaseManager.getInstance()
      const housePool = await dbManager.getHousePool(house_id)

      // Save file path to database
      const filePath = `/uploads/${house_id}/${multerReq.file.filename}`

      const result = await housePool.query("INSERT INTO documents (file_path) VALUES ($1) RETURNING *", [filePath])

      res.status(201).json({
        message: "Document uploaded successfully",
        document: result.rows[0],
      })
    } catch (error) {
      console.error("Error uploading document:", error)
      res.status(500).json({
        message: "Error uploading document",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  })
}

export const remove = async (req: Request, res: Response) => {
  try {
    const { house_id, id } = req.params

    const dbManager = DatabaseManager.getInstance()
    const housePool = await dbManager.getHousePool(house_id)

    // Check if document exists
    const documentResult = await housePool.query("SELECT * FROM documents WHERE id = $1", [id])

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" })
    }

    const document = documentResult.rows[0]

    // Check if document is in use
    const tasksResult = await housePool.query("SELECT COUNT(*) FROM tasks WHERE document_id = $1", [id])

    if (Number.parseInt(tasksResult.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Cannot delete document because it is associated with tasks",
        tasks: Number.parseInt(tasksResult.rows[0].count),
      })
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "../../../", document.file_path)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete document from database
    await housePool.query("DELETE FROM documents WHERE id = $1", [id])

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting document:", error)
    res.status(500).json({
      message: "Error deleting document",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

