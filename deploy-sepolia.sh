#!/bin/bash

# Sepolia 部署和验证脚本
# 使用方法: ./deploy-sepolia.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查环境变量
check_env() {
    echo -e "${BLUE}检查环境变量...${NC}"
    
    # 尝试从 .env 文件加载环境变量
    if [ -f ".env" ]; then
        echo -e "${BLUE}发现 .env 文件，正在加载...${NC}"
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # 调试信息：显示当前 PRIVATE_KEY 的状态（不显示实际值）
    if [ -n "$PRIVATE_KEY" ]; then
        echo -e "${GREEN}✓ PRIVATE_KEY 已设置${NC}"
    else
        echo -e "${RED}✗ PRIVATE_KEY 未设置${NC}"
    fi
    
    if [ -z "$PRIVATE_KEY" ]; then
        echo -e "${RED}错误: PRIVATE_KEY 环境变量未设置${NC}"
        echo "请使用以下方式之一设置私钥:"
        echo "1. 在当前终端中运行: export PRIVATE_KEY=your_private_key"
        echo "2. 创建 .env 文件并添加: PRIVATE_KEY=your_private_key"
        echo "3. 在运行脚本时设置: PRIVATE_KEY=your_private_key ./deploy-sepolia.sh"
        exit 1
    fi
    
    if [ -z "$INFURA_PROJECT_ID" ]; then
        echo -e "${RED}错误: INFURA_PROJECT_ID 环境变量未设置${NC}"
        echo "请设置您的 Infura 项目 ID: export INFURA_PROJECT_ID=your_project_id"
        exit 1
    else
        echo -e "${GREEN}✓ INFURA_PROJECT_ID 已设置${NC}"
    fi
    
    if [ -z "$ETHERSCAN_API_KEY" ]; then
        echo -e "${YELLOW}⚠ ETHERSCAN_API_KEY 环境变量未设置${NC}"
        echo "合约验证将跳过。如需验证，请设置: export ETHERSCAN_API_KEY=your_api_key"
    else
        echo -e "${GREEN}✓ ETHERSCAN_API_KEY 已设置${NC}"
    fi
    
    echo -e "${GREEN}环境变量检查完成${NC}"
}

# 编译合约
compile_contracts() {
    echo -e "${BLUE}编译合约...${NC}"
    forge build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}合约编译成功${NC}"
    else
        echo -e "${RED}合约编译失败${NC}"
        exit 1
    fi
}

# 部署合约
deploy_contracts() {
    echo -e "${BLUE}部署合约到 Sepolia...${NC}"
    
    # 运行部署脚本
    forge script script/DeployToSepolia.s.sol:DeployToSepolia \
        --rpc-url https://sepolia.infura.io/v3/$INFURA_PROJECT_ID \
        --private-key $PRIVATE_KEY \
        --broadcast \
        --verify \
        --etherscan-api-key $ETHERSCAN_API_KEY \
        -vvvv
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}合约部署成功${NC}"
    else
        echo -e "${RED}合约部署失败${NC}"
        exit 1
    fi
}

# 手动验证合约（如果自动验证失败）
manual_verify() {
    if [ -z "$ETHERSCAN_API_KEY" ]; then
        echo -e "${YELLOW}跳过合约验证（未设置 ETHERSCAN_API_KEY）${NC}"
        return
    fi
    
    echo -e "${BLUE}如果自动验证失败，请手动运行以下命令:${NC}"
    echo -e "${YELLOW}注意: 请将 <CONTRACT_ADDRESS> 替换为实际的合约地址${NC}"
    echo ""
    echo "forge verify-contract <MyTokenV4_ADDRESS> src/MyTokenV4.sol:MyTokenV4 --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY"
    echo "forge verify-contract <MyNFTV4_ADDRESS> src/MyNFTV4.sol:MyNFTV4 --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY"
    echo "forge verify-contract <Permit2_ADDRESS> src/Permit2.sol:Permit2 --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY"
    echo "forge verify-contract <MyTokenBankV4_ADDRESS> src/MyTokenBankV4.sol:MyTokenBankV4 --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY"
    echo "forge verify-contract <MyNFTMarketV4_ADDRESS> src/MyNFTMarketV4.sol:MyNFTMarketV4 --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY --constructor-args <ENCODED_DEPLOYER_ADDRESS>"
    echo "forge verify-contract <EIP7702BatchExecutor_ADDRESS> src/EIP7702BatchExecutor.sol:EIP7702BatchExecutor --chain sepolia --etherscan-api-key \$ETHERSCAN_API_KEY"
}

# 主函数
main() {
    echo -e "${GREEN}=== Sepolia 部署脚本 ===${NC}"
    echo ""
    
    check_env
    compile_contracts
    deploy_contracts
    manual_verify
    
    echo ""
    echo -e "${GREEN}=== 部署完成 ===${NC}"
    echo -e "${BLUE}请查看上面的输出获取合约地址${NC}"
    echo -e "${BLUE}部署详情保存在 broadcast/ 目录中${NC}"
}

# 运行主函数
main "$@"