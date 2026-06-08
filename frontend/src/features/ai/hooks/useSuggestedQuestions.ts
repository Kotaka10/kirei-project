import { useEffect, useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { fetchFrequentQuestions } from "../lib/questionApi";
import { FALLBACK_AI_QUESTIONS, type AiQuestionSuggestion } from "../types/aiQuestionTypes";

export function useSuggestedQuestions(enabled: boolean) {
    const { token } = useAuth();
    const [questions, setQuestions] = useState<AiQuestionSuggestion[]>(FALLBACK_AI_QUESTIONS);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!enabled || !token) {
            setQuestions(FALLBACK_AI_QUESTIONS);
            setIsLoading(false);
            return;
        }

        let ignore = false;
        setIsLoading(true);

        fetchFrequentQuestions(token)
            .then((nextQuestions) => {
                if (ignore) return;
                setQuestions(nextQuestions.length > 0 ? nextQuestions : FALLBACK_AI_QUESTIONS);
            })
            .catch(() => {
                if (!ignore) setQuestions(FALLBACK_AI_QUESTIONS);
            })
            .finally(() => {
                if (!ignore) setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [enabled, token]);

    return { questions, isLoading };
}
