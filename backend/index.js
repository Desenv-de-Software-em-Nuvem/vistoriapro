// const express = require('express');
// const routes = require('./src/routes');


import express, { text } from "express";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.json({ 
    message: 'API VistoriaPro rodando!',
    version: '1.0.0',
    environment: process.env.NODE_ENV //|| 'development'
  });
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});