#!/bin/sh

# 此脚本会在每次 Docker 容器启动时运行。它会读取所有以 VITE_ 开头的环境变量 ，
# 创建一个名为 window.__ENV__ 的 JavaScript 对象 ，
# 并将其保存到 env-config.js 文件中 。这样，您就可以在不重新构建镜像的情况下更改 API URL。


# Define the config file path
CONFIG_FILE="/usr/share/nginx/html/env-config.js"

# Start the config object
echo "window.__ENV__ = {" > "$CONFIG_FILE"

# Loop through environment variables that start with VITE_
# and add them to the config object
env | grep "^VITE_" | while read -r line; do
  # Split into key and value
  key=$(echo "$line" | cut -d '=' -f 1)
  value=$(echo "$line" | cut -d '=' -f 2-)
  
  # Append to config file
  echo "  \"$key\": \"$value\"," >> "$CONFIG_FILE"
done

# Close the config object
echo "};" >> "$CONFIG_FILE"

# Execute the CMD passed to the docker container (usually nginx)
exec "$@"
