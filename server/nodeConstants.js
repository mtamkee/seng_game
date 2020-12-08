const Koa = require('koa');
const serve = require('koa-static');
const app = new Koa();
const server = require('http').createServer(app.callback());
const io = require('socket.io')(server);

module.exports = {Koa, serve, app, server, io}