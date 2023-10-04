const express = require("express")
const app = express()
const handlebars = require("express-handlebars").engine
const bodyParser = require("body-parser")
const admin = require('firebase-admin');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')
const path = require('path')

const serviceAccount = require('./ChaveAcesso.json')
const { error } = require('path')

initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://projetonodejs-76476-default-rtdb.firebaseio.com/'
})

const db = getFirestore()

app.engine("handlebars", handlebars({ defaultLayout: "main" }))
app.set("view engine", "handlebars")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('views', path.join(__dirname, 'views'));

app.get("/", function (req, res) {
    res.render("primeira_pagina")
})

app.post("/cadastrar", function (req, res) {
    const collection = db.collection("agendamentos");
    const novoAgendamento = {
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    }
    collection.add(novoAgendamento).then(() => {
        console.log('Documento adicionado com sucesso');
        res.redirect('/');
     }).catch((error) => {
        console.error('Erro ao adicionar documento:', error);
        res.status(500).send('Erro ao adicionar documento');
     });
 });

app.get("/consulta", function (req, res) {
    const collection = db.collection("agendamentos")
    collection.get()
        .then((chaveSnapshot) => {
            var data = [];
            chaveSnapshot.forEach((doc) => {
                const documentId = doc.id;
                const documentData = doc.data();
                data.push({ id: documentId, ...documentData })
            });
            res.render("consulta", { post: data });
        }).catch((error) => {
            console.error("Erro ao consultar agendamento: ", error)
        })
})

app.post("/atualizar", function (req, res) {
    const collection = db.collection("agendamentos");
    const id = req.query.id;

    const updateData = {
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    }

    if (id && typeof id === "string" && id.trim() !== "") {
        collection.doc(id).update(updateData)
            .then(() => {
                console.log("Documento atualizado com sucesso!");
                res.redirect("/consulta");
            })
            .catch((error) => {
                console.error("Erro ao atualizar o documento: ", error);
            });
    } else {
        console.error("ID de documento inválido ou ausente no corpo da solicitação.");
    }
});

app.get("/excluir/:id", function (req, res) {
    const collection = db.collection("agendamentos")
    const documentId = req.params.id;
    collection.doc(documentId).delete().then(() => {
        res.redirect("/consulta");
        console.log("Agendamento excluído com sucesso!")
    })
})

app.get("/editar/:id", function (req, res) {
    const collection = db.collection("agendamentos");
    const documentId = req.params.id;
    const documentRef = collection.doc(documentId);

    documentRef.get().then((doc) => {
        if (doc.exists) {
            const data = { id: documentId, ...doc.data() }
            res.render('editar', data);
        } else {
            console.log("Documento não encontrado.");
        }
    }).catch((error) => {
        console.error("Ocorreu um erro ao buscar o documento: ", error);
    });
});




app.listen(8082, function () {
    console.log("Servidor ativo!")
})

