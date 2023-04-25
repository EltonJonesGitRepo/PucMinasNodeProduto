const express = require('express')
const app = express()

const lista_produtos = {
  produtos: [
    { id: 1, descricao: "Arroz parboilizado 5Kg", valor: 25.00, marca: "Tio João" },
    { id: 2, descricao: "Maionese 250gr", valor: 7.20, marca: "Helmans" },
    { id: 3, descricao: "Iogurte Natural 200ml", valor: 2.50, marca: "Itambé" },
    { id: 4, descricao: "Batata Maior Palha 300gr", valor: 15.20, marca: "Chipps" },
    { id: 5, descricao: "Nescau 400gr", valor: 8.00, marca: "Nestlé" },
  ]
}

app.use(express.json())

// Obter a lista de produtos
app.get('/produtos', (req, res) => {
  res.json(lista_produtos.produtos)
})

// Obter um produto específico
app.get('/produtos/:id', (req, res) => {
  const id = Number(req.params.id)
  const produto = lista_produtos.produtos.find(p => p.id === id)
  if (produto) {
    res.json(produto)
  } else {
    res.status(404).json({ message: 'Produto não encontrado' })
  }
})

// Incluir um produto
app.post('/produtos', (req, res) => {
  const produto = req.body
  produto.id = lista_produtos.produtos.length + 1
  lista_produtos.produtos.push(produto)
  res.status(201).json(produto)
})

// Alterar um produto
app.put('/produtos/:id', (req, res) => {
  const id = Number(req.params.id)
  const produtoIndex = lista_produtos.produtos.findIndex(p => p.id === id)
  if (produtoIndex !== -1) {
    lista_produtos.produtos[produtoIndex] = { ...req.body, id }
    res.json(lista_produtos.produtos[produtoIndex])
  } else {
    res.status(404).json({ message: 'Produto não encontrado' })
  }
})

// Excluir um produto
app.delete('/produtos/:id', (req, res) => {
  const id = Number(req.params.id)
  const produtoIndex = lista_produtos.produtos.findIndex(p => p.id === id)
  if (produtoIndex !== -1) {
    const produtoExcluido = lista_produtos.produtos.splice(produtoIndex, 1)
    res.json(produtoExcluido[0])
  } else {
    res.status(404).json({ message: 'Produto não encontrado' })
  }
})

app.listen(3000, () => {
    console.log('Server running on port 3000');
  });

