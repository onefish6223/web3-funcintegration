#!/bin/bash

# 环境变量测试脚本
# 用于验证部署所需的环境变量是否正确设置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 环境变量测试脚本 ===${NC}"
echo ""

# 尝试从 .env 文件加载环境变量
if [ -f ".env" ]; then
    echo -e "${BLUE}发现 .env 文件，正在加载...${NC}"
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    echo -e "${GREEN}.env 文件加载完成${NC}"
else
    echo -e "${YELLOW}未发现 .env 文件${NC}"
fi

echo ""
echo -e "${BLUE}检查环境变量状态:${NC}"
echo ""

# 检查 PRIVATE_KEY
if [ -n "$PRIVATE_KEY" ]; then
    echo -e "${GREEN}✓ PRIVATE_KEY: 已设置 (长度: ${#PRIVATE_KEY} 字符)${NC}"
    # 验证私钥格式
    if [[ $PRIVATE_KEY =~ ^0x[a-fA-F0-9]{64}$ ]]; then
        echo -e "${GREEN}  格式验证: 正确${NC}"
    else
        echo -e "${RED}  格式验证: 错误 (应为 0x 开头的 64 位十六进制字符串)${NC}"
    fi
else
    echo -e "${RED}✗ PRIVATE_KEY: 未设置${NC}"
fi

# 检查 INFURA_PROJECT_ID
if [ -n "$INFURA_PROJECT_ID" ]; then
    echo -e "${GREEN}✓ INFURA_PROJECT_ID: 已设置 (${INFURA_PROJECT_ID})${NC}"
else
    echo -e "${RED}✗ INFURA_PROJECT_ID: 未设置${NC}"
fi

# 检查 ETHERSCAN_API_KEY
if [ -n "$ETHERSCAN_API_KEY" ]; then
    echo -e "${GREEN}✓ ETHERSCAN_API_KEY: 已设置 (${ETHERSCAN_API_KEY})${NC}"
else
    echo -e "${YELLOW}⚠ ETHERSCAN_API_KEY: 未设置 (可选，用于合约验证)${NC}"
fi

echo ""
echo -e "${BLUE}网络连接测试:${NC}"

# 测试 Infura 连接
if [ -n "$INFURA_PROJECT_ID" ]; then
    echo -n "测试 Sepolia 网络连接... "
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
            "https://sepolia.infura.io/v3/$INFURA_PROJECT_ID" 2>/dev/null || echo "error")
        
        if [[ $response == *"0x"* ]]; then
            echo -e "${GREEN}成功${NC}"
        else
            echo -e "${RED}失败${NC}"
            echo -e "${RED}请检查 INFURA_PROJECT_ID 是否正确${NC}"
        fi
    else
        echo -e "${YELLOW}跳过 (未安装 curl)${NC}"
    fi
else
    echo -e "${RED}跳过网络测试 (INFURA_PROJECT_ID 未设置)${NC}"
fi

echo ""
echo -e "${BLUE}建议的设置方法:${NC}"
echo ""
echo "1. 使用环境变量 (临时):"
echo "   export PRIVATE_KEY=0x..."
echo "   export INFURA_PROJECT_ID=your_project_id"
echo "   export ETHERSCAN_API_KEY=your_api_key"
echo ""
echo "2. 使用 .env 文件 (推荐):"
echo "   cp .env.example .env"
echo "   # 编辑 .env 文件并填入实际值"
echo ""
echo "3. 运行时设置:"
echo "   PRIVATE_KEY=0x... INFURA_PROJECT_ID=... ./deploy-sepolia.sh"

echo ""
if [ -n "$PRIVATE_KEY" ] && [ -n "$INFURA_PROJECT_ID" ]; then
    echo -e "${GREEN}✓ 环境配置完整，可以运行部署脚本${NC}"
else
    echo -e "${RED}✗ 环境配置不完整，请设置缺失的环境变量${NC}"
fi