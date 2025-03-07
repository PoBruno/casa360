import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const ApiDebugger = () => {
  const [logs, setLogs] = useState([]);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Override fetch and axios for debugging
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      const log = {
        type: 'fetch',
        url,
        method: options.method || 'GET',
        headers: options.headers,
        time: new Date().toISOString()
      };
      
      try {
        const response = await originalFetch(...args);
        const clone = response.clone();
        try {
          const data = await clone.json();
          log.status = response.status;
          log.response = data;
        } catch (e) {
          log.responseText = await clone.text();
        }
        setLogs(prev => [log, ...prev].slice(0, 20));
        return response;
      } catch (error) {
        log.error = error.message;
        setLogs(prev => [log, ...prev].slice(0, 20));
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!visible) {
    return (
      <Button 
        variant="outlined" 
        size="small"
        sx={{ position: 'fixed', bottom: 10, right: 10, opacity: 0.7 }}
        onClick={() => setVisible(true)}
      >
        Debug API
      </Button>
    );
  }

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 10, 
        right: 10, 
        width: 400, 
        maxHeight: 400,
        overflow: 'auto',
        zIndex: 9999,
        p: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">API Requests</Typography>
        <Button size="small" onClick={() => setVisible(false)}>Close</Button>
      </Box>
      
      {logs.map((log, i) => (
        <Box key={i} sx={{ mb: 2, p: 1, border: '1px solid #eee' }}>
          <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
            {log.method} {log.url} ({log.status || 'pending'})
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            {log.time}
          </Typography>
          {log.error && (
            <Typography variant="caption" color="error" display="block">
              Error: {log.error}
            </Typography>
          )}
          {log.response && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {JSON.stringify(log.response, null, 2)}
              </Typography>
            </Box>
          )}
        </Box>
      ))}
    </Paper>
  );
};

export default ApiDebugger;