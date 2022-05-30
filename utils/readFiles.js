const fs = require('fs');

function readFiles(nomeDoArquivo) {
  try {
    const conteudoDoArquivo = fs.readFileSync(nomeDoArquivo, 'utf8');
    return conteudoDoArquivo;
  } catch (err) {
    return null;
  }
}
module.exports = readFiles;