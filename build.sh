#!/bin/bash
# 构建脚本：自动替换 SW 缓存版本为部署时间戳
# 用法: bash build.sh && git add sw.js && git commit ...

TIMESTAMP=$(date +%s)
sed -i "s/{{DEPLOY_TIMESTAMP}}/${TIMESTAMP}/" sw.js
echo "SW 缓存版本已更新: ${TIMESTAMP}"
