const fs = require('fs').promises;
const express = require('express');
const bodyParser = require('body-parser');
const readFiles = require('./utils/readFiles');
const generateToken = require('./utils/createToken');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

const getFileData = () => {
  const data = readFiles('talker.json');
  return data;
};

const errorMiddleware = (err, req, res, _next) => {
  console.log(err.message);
  if (err.status) return res.status(err.status).json({ message: err.message });

  if (err) return res.status(500).json({ message: 'Internal Server Error' });
}; 

const validateEmail = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    next({
      status: 400,
      message: 'O campo "email" é obrigatório' });
  }
  
  const regexEmail = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
  const validationEmail = regexEmail.test(email);

  if (!validationEmail) {
    next({
      status: 400,
      message: 'O "email" deve ter o formato "email@email.com"' });
  }
  next();
};

const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) next({ status: 400, message: 'O campo "password" é obrigatório' });
  if (password.length <= 5) {
    next({
        status: 400,
        message: 'O "password" deve ter pelo menos 6 caracteres', 
      }); 
  }
  next();
};

const validateToken = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) { return res.status(401).json({ message: 'Token não encontrado' }); }

  if (authorization.length !== 16) { return res.status(401).json({ message: 'Token inválido' }); }
 
  next();
};

const validateName = (req, res, next) => {
  const { name } = req.body;

  if (!name) next({ status: 400, message: 'O campo "name" é obrigatório' });
  if (name.length <= 2) {
 next({
    status: 400,
    message: 'O "name" deve ter pelo menos 3 caracteres', 
  }); 
}
  next();
};

const validateAge = (req, res, next) => {
  const { age } = req.body;

  if (!age) next({ status: 400, message: 'O campo "age" é obrigatório' });
  if (age < 18) {
 next({
    status: 400,
    message: 'A pessoa palestrante deve ser maior de idade', 
  }); 
}
  next();
};

const validateDate = (req, res, next) => {
  const { talk } = req.body;
  const { watchedAt } = talk;
  // https://stackoverflow.com/questions/10194464/javascript-dd-mm-yyyy-date-check
  const regexDate = /(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d/;
  const validateDateBool = regexDate.test(watchedAt);
  if (!validateDateBool) {
    next({
      status: 400,
      message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"', 
    }); 
  }
  next();
};

const validateRate = (req, res, next) => {
  const { talk } = req.body;
  const { rate } = talk;

  if (rate < 1 || rate > 5 || !Number.isInteger(rate)) {
    next({
      status: 400,
      message: 'O campo "rate" deve ser um inteiro de 1 à 5', 
    }); 
  }
  next();
};

const validateTalkElse = (watchedAt, rate, nextParam) => {
  if ((!watchedAt || !rate) && rate !== 0) {
    nextParam({
      status: 400,
      message: 'O campo "talk" é obrigatório e "watchedAt" e "rate" não podem ser vazios', 
    }); 
  }
};

const validateTalk = (req, res, next) => {
  const { talk } = req.body;
  if (!talk) {
    next({
      status: 400,
      message: 'O campo "talk" é obrigatório e "watchedAt" e "rate" não podem ser vazios', 
    }); 
  } else {
    const { watchedAt, rate } = talk;
    validateTalkElse(watchedAt, rate, next);
  }
  next();
};

app.get('/talker', (req, res) => {
  const data = getFileData();
  if (!data) return res.status(200).json([]);
  return res.status(200).json(JSON.parse(data));
});

app.post('/login', validateEmail, validatePassword, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
     return res.status(401).json({ message: 'Email and Password must be provides' });
  }
  return res.status(200).json({ token: generateToken(16) });
});

app.post(
  '/talker', 
  validateToken,
  validateName,
  validateAge,
  validateTalk,
  validateDate,
  validateRate,
  (req, res) => {
  const { name, age, talk: { watchedAt, rate } } = req.body;
  const newPeople = {
    id: 5,
    name,
    age,
    talk: {
      watchedAt,
      rate,
    },
  };
  const data = getFileData();
  const jsonData = JSON.parse(data);
  const newArray = [...jsonData, newPeople];
  fs.writeFile('./talker.json', JSON.stringify(newArray));
  return res.status(201).json(newPeople);
},
);

app.put(
  '/talker/:id',
  validateToken,
  validateName,
  validateAge,
  validateTalk,
  validateDate,
  validateRate, 
  (req, res) => {
    const { name, age, talk: { watchedAt, rate } } = req.body;
    const data = {
      id: 5,
      name,
      age,
      talk: {
        watchedAt,
        rate,
      },
    };
    if (data.id === Number(req.params.id)) {
      fs.writeFile('./talker.json', JSON.stringify([data]));
      return res.status(200).json(data);
    }
  },
);

app.delete('/talker/:id', validateToken, (req, res) => {
  const data = getFileData();
  const jsonData = JSON.parse(data);
  const filtredPeoples = jsonData.filter((element) => element.id !== Number(req.params.id));
  fs.writeFile('./talker.json', JSON.stringify([filtredPeoples]));

  return res.status(204).json();
});

app.get('/talker/search', validateToken, (req, res) => {
  const searchParam = req.query.q;
  const data = getFileData();
  const jsonData = JSON.parse(data);
  if (!searchParam || searchParam.length === 0) {
    return res.status(200).json(JSON.parse(data));
  }
  const filtredPeoples = jsonData.filter((element) => element.name.includes(searchParam));
  return res.status(200).json(filtredPeoples);
});

app.get('/talker/:id', (req, res) => {
  const data = getFileData();
  const { id } = req.params;
  const filtredPeople = JSON.parse(data).find((element) => element.id === Number(id));
  if (!filtredPeople) return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  return res.status(200).json(filtredPeople);
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log('Online');
});