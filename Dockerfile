# Usar uma imagem base do Node.js
FROM node:14

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar o package.json e o package-lock.json (se existir)
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Copiar o código da aplicação para o diretório de trabalho no contêiner
COPY . .

# Expor a porta que a aplicação irá rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "index.js"]
