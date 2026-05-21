import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StaffRepository } from "../repositories/staffRepository.js";

const JWT_SECRET  = process.env.JWT_SECRET ?? "change-this-secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? "8h";

class AuthError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
    }
}

export class AuthService {
    private staffRepo = new StaffRepository();

    async login(email: string, password: string) {
        const staff = await this.staffRepo.findByEmail(email);

        if (!staff) {
            throw new AuthError("メールアドレスまたはパスワードが違います", 401);
        }

        const isValid = await bcrypt.compare(password, staff.password_hash);
        if (!isValid) {
            throw new AuthError("メールアドレスまたはパスワードが違います", 401);
        }

        const payload = {
            staff_id: staff.id,
            name:     staff.name,
            role:     staff.role,
            email:    staff.email,
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES as any });

        this.staffRepo.updateLastLogin(staff.id).catch(console.error);

        return {
            token,
            user: {
                name: staff.name,
                role: staff.role,
                email: staff.email,
            },
        };
    }

    verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            return {
                staff_id: decoded.staff_id,
                name:     decoded.name,
                role:     decoded.role,
                email:    decoded.email,
            };
        } catch {
            throw new AuthError("トークンが無効または期限切れです", 401);
        }
    }
}