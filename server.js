const start = async () => {
  console.log('Server starting...');
  
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  
  console.log(`Server will run on http://localhost:${port}`);
};

start();
