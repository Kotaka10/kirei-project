import { z } from "zod";

export const SKILL_LEVEL_LABELS: Record<number, string> = {
    1: "見習い",
    2: "初級",
    3: "中級",
    4: "上級",
    5: "エキスパート",
};

export const SkillSchema = z.object({
    id:          z.number(),
    name:        z.string(),
    category:    z.enum(["清掃", "技術", "資格", "対応力"]),
    description: z.string(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const StaffSkillSchema = z.object({
    skill_id:    z.number(),
    skill_name:  z.string(),
    category:    z.enum(["清掃", "技術", "資格", "対応力"]),
    level:       z.number().min(1).max(5),
    acquired_at: z.string().nullable(),
});
export type StaffSkill = z.infer<typeof StaffSkillSchema>;

export const StaffWithSkillsSchema = z.object({
    id:     z.number(),
    name:   z.string(),
    role:   z.enum(["cleaner", "technician", "supervisor"]),
    skills: z.array(StaffSkillSchema),
});
export type StaffWithSkills = z.infer<typeof StaffWithSkillsSchema>;

export const ROLE_LABELS: Record<string, string> = {
    cleaner:    "清掃員",
    technician: "技術者",
    supervisor: "管理者",
};

export const CATEGORY_COLORS: Record<string, string> = {
    清掃:  "bg-blue-100 text-blue-800",
    技術:  "bg-purple-100 text-purple-800",
    資格:  "bg-yellow-100 text-yellow-800",
    対応力: "bg-green-100 text-green-800",
};
