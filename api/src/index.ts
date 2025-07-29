import './server';

// 主入口文件，启动API服务器
console.log('ERC20 Transfer Indexer API starting...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Token Contract:', process.env.TOKEN_CONTRACT_ADDRESS);
console.log('RPC URL:', process.env.RPC_URL ? 'Configured' : 'Not configured');

// 如果需要同时运行索引器，可以在这里启动
// import ERC20Indexer from './indexer';
// const indexer = new ERC20Indexer();
// indexer.start().catch(console.error);