import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ── Resolve storage path ────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "todos.json");

// ── Data types ───────────────────────────────────────────────────────────────
interface Todo {
    id: number;
    task: string;
    done: boolean;
    priority: "low" | "medium" | "high";
    createdAt: string;
    doneAt?: string;
}


function load(): Todo[] {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    } catch {
        return [];
    }
}

function save(todos: Todo[]) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), "utf-8");
}

function nextId(todos: Todo[]): number {
    return todos.length === 0 ? 1 : Math.max(...todos.map((t) => t.id)) + 1;
}

function formatTodo(t: Todo): string {
    const status = t.done ? "✅" : "⬜";
    const pri = { low: "🟢", medium: "🟡", high: "🔴" }[t.priority];
    const done = t.doneAt ? ` | Hoàn thành: ${t.doneAt}` : "";
    return `${status} [#${t.id}] ${pri} ${t.task} | Tạo: ${t.createdAt}${done}`;
}

// ── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
    name: "todo-manager",
    version: "1.0.0",
});

// 1. List todos
server.tool(
    "list_todos",
    {
        filter: z
            .enum(["all", "pending", "done"])
            .optional()
            .default("all")
            .describe("Lọc: all | pending | done"),
        priority: z
            .enum(["all", "low", "medium", "high"])
            .optional()
            .default("all")
            .describe("Ưu tiên: all | low | medium | high"),
    },
    async ({ filter, priority }) => {
        let todos = load();
        if (filter === "pending") todos = todos.filter((t) => !t.done);
        if (filter === "done") todos = todos.filter((t) => t.done);
        if (priority !== "all") todos = todos.filter((t) => t.priority === priority);

        if (todos.length === 0) {
            return { content: [{ type: "text", text: "📭 Không có todo nào." }] };
        }

        const lines = todos.map(formatTodo).join("\n");
        const summary = `\n\n📊 Tổng: ${todos.length} | ✅ Xong: ${todos.filter((t) => t.done).length} | ⬜ Còn lại: ${todos.filter((t) => !t.done).length}`;
        return { content: [{ type: "text", text: lines + summary }] };
    }
);

// 2. Add todo
server.tool(
    "add_todo",
    {
        task: z.string().min(1).describe("Nội dung công việc"),
        priority: z
            .enum(["low", "medium", "high"])
            .optional()
            .default("medium")
            .describe("Độ ưu tiên"),
    },
    async ({ task, priority }) => {
        const todos = load();
        const todo: Todo = {
            id: nextId(todos),
            task,
            done: false,
            priority,
            createdAt: new Date().toLocaleString("vi-VN"),
        };
        todos.push(todo);
        save(todos);
        return {
            content: [{ type: "text", text: `✅ Đã thêm:\n${formatTodo(todo)}` }],
        };
    }
);

// 3. Complete todo
server.tool(
    "complete_todo",
    { id: z.number().int().positive().describe("ID của todo cần đánh dấu xong") },
    async ({ id }) => {
        const todos = load();
        const todo = todos.find((t) => t.id === id);
        if (!todo) return { content: [{ type: "text", text: `❌ Không tìm thấy todo #${id}` }] };
        if (todo.done) return { content: [{ type: "text", text: `ℹ️ Todo #${id} đã hoàn thành rồi.` }] };
        todo.done = true;
        todo.doneAt = new Date().toLocaleString("vi-VN");
        save(todos);
        return { content: [{ type: "text", text: `🎉 Đã hoàn thành:\n${formatTodo(todo)}` }] };
    }
);

// 4. Delete todo
server.tool(
    "delete_todo",
    { id: z.number().int().positive().describe("ID của todo cần xoá") },
    async ({ id }) => {
        const todos = load();
        const idx = todos.findIndex((t) => t.id === id);
        if (idx === -1) return { content: [{ type: "text", text: `❌ Không tìm thấy todo #${id}` }] };
        const [removed] = todos.splice(idx, 1);
        save(todos);
        return { content: [{ type: "text", text: `🗑️ Đã xoá: ${removed.task}` }] };
    }
);

// 5. Edit todo
server.tool(
    "edit_todo",
    {
        id: z.number().int().positive().describe("ID của todo cần sửa"),
        task: z.string().min(1).optional().describe("Nội dung mới (tuỳ chọn)"),
        priority: z
            .enum(["low", "medium", "high"])
            .optional()
            .describe("Độ ưu tiên mới (tuỳ chọn)"),
    },
    async ({ id, task, priority }) => {
        const todos = load();
        const todo = todos.find((t) => t.id === id);
        if (!todo) return { content: [{ type: "text", text: `❌ Không tìm thấy todo #${id}` }] };
        if (task) todo.task = task;
        if (priority) todo.priority = priority;
        save(todos);
        return { content: [{ type: "text", text: `✏️ Đã cập nhật:\n${formatTodo(todo)}` }] };
    }
);

// 6. Clear all done todos
server.tool("clear_done", {}, async () => {
    const todos = load();
    const before = todos.length;
    const remaining = todos.filter((t) => !t.done);
    save(remaining);
    return {
        content: [
            {
                type: "text",
                text: `🧹 Đã xoá ${before - remaining.length} todo đã hoàn thành. Còn lại: ${remaining.length}`,
            },
        ],
    };
});

// ── Start ────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);