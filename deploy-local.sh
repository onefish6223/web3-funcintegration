#!/bin/bash

# 本地 Anvil 部署脚本
# 使用方法: ./deploy-local.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
ANVIL_PORT=8545
ANVIL_HOST="127.0.0.1"
RPC_URL="http://${ANVIL_HOST}:${ANVIL_PORT}"
DEFAULT_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ANVIL_PID_FILE=".anvil.pid"

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}检查依赖...${NC}"
    
    # 检查 forge
    if ! command -v forge &> /dev/null; then
        echo -e "${RED}错误: forge 未安装${NC}"
        echo "请安装 Foundry: https://book.getfoundry.sh/getting-started/installation"
        exit 1
    fi
    
    # 检查 anvil
    if ! command -v anvil &> /dev/null; then
        echo -e "${RED}错误: anvil 未安装${NC}"
        echo "请安装 Foundry: https://book.getfoundry.sh/getting-started/installation"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 依赖检查完成${NC}"
}

# 检查环境变量
check_env() {
    echo -e "${BLUE}检查环境变量...${NC}"
    
    # 尝试从 .env 文件加载环境变量
    if [ -f ".env" ]; then
        echo -e "${BLUE}发现 .env 文件，正在加载...${NC}"
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # 如果没有设置 PRIVATE_KEY，使用默认的 Anvil 私钥
    if [ -z "$PRIVATE_KEY" ]; then
        echo -e "${YELLOW}⚠ PRIVATE_KEY 未设置，使用默认 Anvil 私钥${NC}"
        export PRIVATE_KEY=$DEFAULT_PRIVATE_KEY
    else
        echo -e "${GREEN}✓ PRIVATE_KEY 已设置${NC}"
    fi
    
    echo -e "${GREEN}环境变量检查完成${NC}"
}

# 启动 Anvil
start_anvil() {
    echo -e "${BLUE}启动 Anvil 本地节点...${NC}"
    
    # 检查端口是否被占用
    if lsof -Pi :$ANVIL_PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠ 端口 $ANVIL_PORT 已被占用，尝试停止现有进程...${NC}"
        stop_anvil
        sleep 2
    fi
    
    # 启动 Anvil
    anvil --host $ANVIL_HOST --port $ANVIL_PORT --accounts 10 --balance 10000 > anvil.log 2>&1 &
    ANVIL_PID=$!
    echo $ANVIL_PID > $ANVIL_PID_FILE
    
    # 等待 Anvil 启动
    echo -e "${BLUE}等待 Anvil 启动...${NC}"
    for i in {1..10}; do
        if curl -s $RPC_URL > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Anvil 已启动 (PID: $ANVIL_PID)${NC}"
            echo -e "${GREEN}✓ RPC URL: $RPC_URL${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}错误: Anvil 启动失败${NC}"
    exit 1
}

# 停止 Anvil
stop_anvil() {
    if [ -f "$ANVIL_PID_FILE" ]; then
        ANVIL_PID=$(cat $ANVIL_PID_FILE)
        if ps -p $ANVIL_PID > /dev/null 2>&1; then
            echo -e "${BLUE}停止 Anvil (PID: $ANVIL_PID)...${NC}"
            kill $ANVIL_PID
            rm -f $ANVIL_PID_FILE
            echo -e "${GREEN}✓ Anvil 已停止${NC}"
        else
            rm -f $ANVIL_PID_FILE
        fi
    else
        # 尝试通过端口杀死进程
        PID=$(lsof -ti:$ANVIL_PORT)
        if [ ! -z "$PID" ]; then
            echo -e "${BLUE}停止占用端口 $ANVIL_PORT 的进程 (PID: $PID)...${NC}"
            kill $PID
        fi
    fi
}

# 编译合约
compile_contracts() {
    echo -e "${BLUE}编译合约...${NC}"
    forge build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 合约编译成功${NC}"
    else
        echo -e "${RED}✗ 合约编译失败${NC}"
        exit 1
    fi
}

# 部署初始合约
deploy_initial_contracts() {
    echo -e "${BLUE}部署初始合约到本地 Anvil...${NC}"
    
    # 运行初始部署脚本
    forge script script/DeployUpgradeableContracts.s.sol:DeployUpgradeableContracts \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --broadcast \
        -vvv
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 初始合约部署成功${NC}"
    else
        echo -e "${RED}✗ 初始合约部署失败${NC}"
        exit 1
    fi
}

# 部署升级合约（可选）
deploy_upgrade_contracts() {
    echo -e "${BLUE}是否要运行合约升级测试？ (y/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}运行合约升级...${NC}"
        
        forge script script/UpgradeContracts.s.sol:UpgradeContracts \
            --rpc-url $RPC_URL \
            --private-key $PRIVATE_KEY \
            --broadcast \
            -vvv
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 合约升级成功${NC}"
        else
            echo -e "${RED}✗ 合约升级失败${NC}"
        fi
    else
        echo -e "${YELLOW}跳过合约升级${NC}"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo -e "${GREEN}=== 部署信息 ===${NC}"
    echo -e "${BLUE}RPC URL: $RPC_URL${NC}"
    echo -e "${BLUE}Chain ID: 31337${NC}"
    echo -e "${BLUE}部署账户: $(cast wallet address $PRIVATE_KEY)${NC}"
    echo -e "${BLUE}部署详情保存在 broadcast/ 目录中${NC}"
    echo ""
    echo -e "${YELLOW}常用命令:${NC}"
    echo "  查看账户余额: cast balance $(cast wallet address $PRIVATE_KEY) --rpc-url $RPC_URL"
    echo "  停止 Anvil: ./deploy-local.sh stop"
    echo "  查看 Anvil 日志: tail -f anvil.log"
}

# 清理函数
cleanup() {
    echo -e "${BLUE}清理资源...${NC}"
    stop_anvil
    exit 0
}

# 处理脚本参数
handle_args() {
    case "$1" in
        "stop")
            stop_anvil
            exit 0
            ;;
        "restart")
            stop_anvil
            sleep 2
            start_anvil
            exit 0
            ;;
        "status")
            if [ -f "$ANVIL_PID_FILE" ]; then
                ANVIL_PID=$(cat $ANVIL_PID_FILE)
                if ps -p $ANVIL_PID > /dev/null 2>&1; then
                    echo -e "${GREEN}✓ Anvil 正在运行 (PID: $ANVIL_PID)${NC}"
                    echo -e "${GREEN}✓ RPC URL: $RPC_URL${NC}"
                else
                    echo -e "${RED}✗ Anvil 未运行${NC}"
                    rm -f $ANVIL_PID_FILE
                fi
            else
                echo -e "${RED}✗ Anvil 未运行${NC}"
            fi
            exit 0
            ;;
        "help" | "-h" | "--help")
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  (无参数)  启动 Anvil 并部署合约"
            echo "  stop      停止 Anvil"
            echo "  restart   重启 Anvil"
            echo "  status    查看 Anvil 状态"
            echo "  help      显示此帮助信息"
            exit 0
            ;;
    esac
}

# 主函数
main() {
    echo -e "${GREEN}=== 本地 Anvil 部署脚本 ===${NC}"
    echo ""
    
    # 处理参数
    handle_args "$1"
    
    # 设置信号处理
    trap cleanup SIGINT SIGTERM
    
    check_dependencies
    check_env
    start_anvil
    compile_contracts
    deploy_initial_contracts
    deploy_upgrade_contracts
    show_deployment_info
    
    echo ""
    echo -e "${GREEN}=== 部署完成 ===${NC}"
    echo -e "${BLUE}Anvil 将继续运行，按 Ctrl+C 停止${NC}"
    
    # 保持脚本运行，直到用户中断
    while true; do
        sleep 1
    done
}

# 运行主函数
main "$@"