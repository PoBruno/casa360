import type { Request, Response } from "express"
import DatabaseManager from "../services/databaseManager"
import { v4 as uuidv4 } from "uuid"

export const createHouse = async (req: Request, res: Response) => {
  try {
    const { house_name, description, address } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!house_name) {
      return res.status(400).json({ message: 'House name is required' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Create house in data-user database
    const houseResult = await userPool.query(
      `
      INSERT INTO houses (user_id, house_name, description, address)
      VALUES ($1, $2, $3, $4)
      RETURNING id, house_name, description, address, created_at
    `,
      [userId, house_name, description, address],
    )

    const house = houseResult.rows[0]

    // Create house database in data-casa instance
    await dbManager.createHouseDatabase(house.id)

    // Update db_created flag
    await userPool.query(
      `
      UPDATE houses SET db_created = true WHERE id = $1
    `,
      [house.id],
    )

    res.status(201).json({
      message: 'House created successfully',
      house
    });
  } catch (error) {
    console.error("Error creating house:", error)
    res.status(500).json({ 
      message: 'Error creating house',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const getUserHouses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Get all houses for the user
    const result = await userPool.query(
      `
      SELECT h.id, h.house_name, h.description, h.address, h.cover_image_url, 
             h.created_at, hu.role, r.permissions
      FROM houses h
      JOIN house_users hu ON h.id = hu.house_id
      JOIN roles r ON hu.role = r.name
      WHERE hu.user_id = $1
      ORDER BY h.created_at DESC
    `,
      [userId],
    )

    res.json({
      count: result.rows.length,
      houses: result.rows,
    })
  } catch (error) {
    console.error("Error fetching houses:", error)
    res.status(500).json({ 
      message: 'Error fetching houses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const getHouseById = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Get house details
    const houseResult = await userPool.query(
      `
      SELECT h.id, h.house_name, h.description, h.address, h.cover_image_url, 
             h.created_at, h.updated_at, hu.role
      FROM houses h
      JOIN house_users hu ON h.id = hu.house_id
      WHERE h.id = $1 AND hu.user_id = $2
    `,
      [house_id, userId],
    )

    if (houseResult.rows.length === 0) {
      return res.status(404).json({ message: 'House not found or access denied' });
    }

    // Get all members of the house
    const membersResult = await userPool.query(
      `
      SELECT u.id, u.username, u.full_name, u.avatar_url, hu.role, hu.joined_at
      FROM house_users hu
      JOIN users u ON hu.user_id = u.id
      WHERE hu.house_id = $1
    `,
      [house_id],
    )

    res.json({
      house: houseResult.rows[0],
      members: membersResult.rows,
    })
  } catch (error) {
    console.error("Error fetching house:", error)
    res.status(500).json({ 
      message: 'Error fetching house details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const updateHouse = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { house_name, description, address, cover_image_url } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Only owners can update house details
    if (userRole !== "owner") {
      return res.status(403).json({ message: 'Only house owners can update house details' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Update house details
    const result = await userPool.query(
      `
      UPDATE houses
      SET house_name = COALESCE($1, house_name),
          description = COALESCE($2, description),
          address = COALESCE($3, address),
          cover_image_url = COALESCE($4, cover_image_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, house_name, description, address, cover_image_url, updated_at
    `,
      [house_name, description, address, cover_image_url, house_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'House not found' });
    }

    res.json({
      message: "House updated successfully",
      house: result.rows[0],
    })
  } catch (error) {
    console.error("Error updating house:", error)
    res.status(500).json({ 
      message: 'Error updating house',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const deleteHouse = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Only owners can delete houses
    if (userRole !== "owner") {
      return res.status(403).json({ message: 'Only house owners can delete houses' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Delete house from data-user database
    const result = await userPool.query(
      `
      DELETE FROM houses WHERE id = $1 RETURNING id
    `,
      [house_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'House not found' });
    }

    // Connect to postgres to drop the house database
    const adminPool = await dbManager.getHousePool("postgres")

    try {
      // Drop connections to the database
      await adminPool.query(
        `
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = $1
      `,
        [house_id],
      )

      // Drop the database
      await adminPool.query(`DROP DATABASE IF EXISTS "${house_id}"`)
    } finally {
      await adminPool.end()
    }

    res.json({ message: "House deleted successfully" })
  } catch (error) {
    console.error("Error deleting house:", error)
    res.status(500).json({ 
      message: 'Error deleting house',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const inviteUserToHouse = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { email, role } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    // Validate role
    if (!["member", "visitor"].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be member or visitor' });
    }

    // Only owners can invite users
    if (userRole !== "owner") {
      return res.status(403).json({ message: 'Only house owners can invite users' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Check if user already exists
    const userResult = await userPool.query(
      `
      SELECT id FROM users WHERE email = $1
    `,
      [email],
    )

    // Generate invitation token
    const token = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    if (userResult.rows.length > 0) {
      // User exists, check if already a member
      const invitedUserId = userResult.rows[0].id

      const memberResult = await userPool.query(
        `
        SELECT * FROM house_users 
        WHERE house_id = $1 AND user_id = $2
      `,
        [house_id, invitedUserId],
      )

      if (memberResult.rows.length > 0) {
        return res.status(409).json({ message: 'User is already a member of this house' });
      }

      // Create invitation
      await userPool.query(
        `
        INSERT INTO house_invitations (house_id, invited_email, invited_by, role, token, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [house_id, email, userId, role, token, expiresAt],
      )

      // TODO: Send invitation email

      res.status(201).json({
        message: 'Invitation sent successfully',
        token
      });
    } else {
      // User doesn't exist, create invitation
      await userPool.query(
        `
        INSERT INTO house_invitations (house_id, invited_email, invited_by, role, token, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [house_id, email, userId, role, token, expiresAt],
      )

      // TODO: Send invitation email with registration link

      res.status(201).json({
        message: 'Invitation sent successfully',
        token
      });
    }
  } catch (error) {
    console.error("Error inviting user:", error)
    res.status(500).json({ 
      message: 'Error inviting user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Get invitation
    const invitationResult = await userPool.query(
      `
      SELECT * FROM house_invitations 
      WHERE token = $1 AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP
    `,
      [token],
    )

    if (invitationResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    const invitation = invitationResult.rows[0]

    // Get user email
    const userResult = await userPool.query(
      `
      SELECT email FROM users WHERE id = $1
    `,
      [userId],
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userEmail = userResult.rows[0].email

    // Verify that the invitation was for this user
    if (invitation.invited_email !== userEmail) {
      return res.status(403).json({ message: 'This invitation was not sent to your email address' });
    }

    // Add user to house
    await userPool.query(
      `
      INSERT INTO house_users (user_id, house_id, role, invited_by, invitation_status)
      VALUES ($1, $2, $3, $4, 'accepted')
      ON CONFLICT (user_id, house_id) DO UPDATE
      SET role = $3, invitation_status = 'accepted', updated_at = CURRENT_TIMESTAMP
    `,
      [userId, invitation.house_id, invitation.role, invitation.invited_by],
    )

    // Update invitation status
    await userPool.query(
      `
      UPDATE house_invitations
      SET status = 'accepted'
      WHERE id = $1
    `,
      [invitation.id],
    )

    res.json({
      message: "Invitation accepted successfully",
      house_id: invitation.house_id,
      role: invitation.role,
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    res.status(500).json({ 
      message: 'Error accepting invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const getHouseMembers = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Get all members of the house
    const result = await userPool.query(
      `
      SELECT u.id, u.username, u.full_name, u.avatar_url, hu.role, hu.joined_at
      FROM house_users hu
      JOIN users u ON hu.user_id = u.id
      WHERE hu.house_id = $1
      ORDER BY hu.role, u.username
    `,
      [house_id],
    )

    res.json({
      count: result.rows.length,
      members: result.rows,
    })
  } catch (error) {
    console.error("Error fetching house members:", error)
    res.status(500).json({ 
      message: 'Error fetching house members',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { house_id, member_id } = req.params
    const { role } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    // Validate role
    if (!["owner", "member", "visitor"].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be owner, member, or visitor' });
    }

    // Only owners can change roles
    if (userRole !== "owner") {
      return res.status(403).json({ message: 'Only house owners can change member roles' });
    }

    // Cannot change your own role
    if (userId === member_id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Update member role
    const result = await userPool.query(
      `
      UPDATE house_users
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE house_id = $2 AND user_id = $3
      RETURNING *
    `,
      [role, house_id, member_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found in this house' });
    }

    res.json({
      message: "Member role updated successfully",
      member: result.rows[0],
    })
  } catch (error) {
    console.error("Error updating member role:", error)
    res.status(500).json({ 
      message: 'Error updating member role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { house_id, member_id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Only owners can remove members
    if (userRole !== "owner") {
      return res.status(403).json({ message: 'Only house owners can remove members' });
    }

    // Cannot remove yourself
    if (userId === member_id) {
      return res.status(400).json({ message: 'Cannot remove yourself. Use leave house instead' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Remove member
    const result = await userPool.query(
      `
      DELETE FROM house_users
      WHERE house_id = $1 AND user_id = $2
      RETURNING *
    `,
      [house_id, member_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found in this house' });
    }

    res.json({
      message: "Member removed successfully",
    })
  } catch (error) {
    console.error("Error removing member:", error)
    res.status(500).json({ 
      message: 'Error removing member',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const leaveHouse = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // If user is the owner, they cannot leave unless they transfer ownership
    if (userRole === "owner") {
      // Check if there are other members
      const dbManager = DatabaseManager.getInstance()
      const userPool = await dbManager.getUserPool()

      const membersResult = await userPool.query(
        `
        SELECT COUNT(*) as count FROM house_users WHERE house_id = $1
      `,
        [house_id],
      )

      if (Number.parseInt(membersResult.rows[0].count) > 1) {
        return res.status(400).json({ 
          message: 'As the owner, you must transfer ownership before leaving the house',
          code: 'TRANSFER_OWNERSHIP_REQUIRED'
        });
      }

      // If the owner is the only member, they can delete the house instead
      return res.status(400).json({ 
        message: 'As the only member and owner, you should delete the house instead of leaving it',
        code: 'DELETE_HOUSE_INSTEAD'
      });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Leave house
    const result = await userPool.query(
      `
      DELETE FROM house_users
      WHERE house_id = $1 AND user_id = $2
      RETURNING *
    `,
      [house_id, userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'You are not a member of this house' });
    }

    res.json({
      message: "You have left the house successfully",
    })
  } catch (error) {
    console.error("Error leaving house:", error)
    res.status(500).json({ 
      message: 'Error leaving house',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const transferOwnership = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params
    const { new_owner_id } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!new_owner_id) {
      return res.status(400).json({ message: 'New owner ID is required' });
    }

    // Only owners can transfer ownership
    if (userRole !== "owner") {
      return res.status(403).json({ message: 'Only house owners can transfer ownership' });
    }

    const dbManager = DatabaseManager.getInstance()
    const userPool = await dbManager.getUserPool()

    // Check if new owner is a member of the house
    const memberResult = await userPool.query(
      `
      SELECT * FROM house_users
      WHERE house_id = $1 AND user_id = $2
    `,
      [house_id, new_owner_id],
    )

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ message: 'New owner is not a member of this house' });
    }

    // Begin transaction
    const client = await userPool.connect()

    try {
      await client.query("BEGIN")

      // Change current owner to member
      await client.query(
        `
        UPDATE house_users
        SET role = 'member', updated_at = CURRENT_TIMESTAMP
        WHERE house_id = $1 AND user_id = $2
      `,
        [house_id, userId],
      )

      // Change new owner to owner
      await client.query(
        `
        UPDATE house_users
        SET role = 'owner', updated_at = CURRENT_TIMESTAMP
        WHERE house_id = $1 AND user_id = $2
      `,
        [house_id, new_owner_id],
      )

      await client.query("COMMIT")

      res.json({
        message: "Ownership transferred successfully",
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error transferring ownership:", error)
    res.status(500).json({ 
      message: 'Error transferring ownership',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

