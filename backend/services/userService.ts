import type { UserInfoTypes } from "../../shared/types/UserInfoTypes.js";
import * as userRepository from "../repositories/userRepository.js";

export const createUser = async (user: UserInfoTypes) => {
    const insertId = await userRepository.createUser(user);

    const newUser = {
        ...user,
        id: insertId
    };

    return newUser;
}