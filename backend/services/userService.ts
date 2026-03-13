import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { userInfoTypes } from "../../shared/types/userInfoTypes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../data/users.json");

export const createUser = (user: userInfoTypes) => {
    const users = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    const maxId = users.length
        ? Math.max(...users.map((u: userInfoTypes) => u.id))
        : 0;

    const newUser = {
        ...user,
        id: maxId + 1,
    };

    users.push(newUser);

    fs.writeFileSync(
        dataPath,
        JSON.stringify(users, null, 2)
    );

    return newUser;
}