# Todo MCP Server

Custom MCP Server quản lý danh sách công việc (todo), tích hợp với **Claude Desktop** và **Claude Code**.

## Yêu cầu hệ thống

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Claude Desktop** hoặc **Claude Code**

## Cài đặt

```bash
git clone https://github.com/namdn2470/Gmail-MCP.git
cd Gmail-MCP
npm install
npm run build
```

## Kết nối MCP

### Claude Code (nhanh nhất)

```bash
claude mcp add todo-manager node "$(pwd)/build/index.js"
claude mcp list   # kiểm tra kết nối
```

### Claude Desktop

Mở file config:

| OS | Đường dẫn |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Thêm nội dung (thay `<ĐƯỜNG_DẪN>` bằng đường dẫn thực tế):

```json
{
  "mcpServers": {
    "todo-manager": {
      "command": "node",
      "args": ["<ĐƯỜNG_DẪN>/build/index.js"]
    }
  }
}
```

Restart Claude Desktop → tools xuất hiện tự động ✅

## Scripts

```bash
npm run build   # Compile TypeScript
npm run dev     # Chạy trực tiếp (tsx)
npm start       # Chạy file đã build
```

## Các tools

| Tool | Mô tả | Tham số |
|---|---|---|
| `list_todos` | Xem danh sách | `filter`: all/pending/done · `priority`: all/low/medium/high |
| `add_todo` | Thêm việc mới | `task`* · `priority`: low/medium/high |
| `complete_todo` | Đánh dấu xong | `id`* |
| `delete_todo` | Xoá theo ID | `id`* |
| `edit_todo` | Sửa nội dung/priority | `id`* · `task` · `priority` |
| `clear_done` | Dọn sạch việc đã xong | — |

