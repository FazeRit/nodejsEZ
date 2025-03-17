'use strict'

import express from 'express';
import cors from 'cors';

require('dotenv').config;

const app = express();

app.use(express.json());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}))

app.listen(process.env.PORT | 3001, () => {
    console.log('Server is up on ')
})
