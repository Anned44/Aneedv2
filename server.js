const express = require('express');
const fetch = require('node-fetch');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});