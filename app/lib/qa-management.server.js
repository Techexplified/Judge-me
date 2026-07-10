import { authenticate } from "../shopify.server";
import db from "../db.server";
import { normalizeShopDomain } from "../utils/shop.js";
import { getGroupShopList } from "../lib/store-group.server.js";

export async function loadQAManagementData({ session }) {
    const shop = normalizeShopDomain(session.shop);
    const targetShops = await getGroupShopList(shop);

    const questions = await db.QuestionAndAnswer.findMany({
        where: { shop: { in: targetShops } },
        orderBy: { createdAt: "desc" },
    });

    const unanswered = questions.filter((q) => q.status === "UNANSWERED").length;
    const answered = questions.filter((q) => q.status === "ANSWERED").length;

    return {
        questions,
        counts: { all: questions.length, unanswered, answered },
    };
}

export async function handleQAManagementAction(requestOrCtx) {
    try {
        let session, formData;
        if (requestOrCtx && typeof requestOrCtx.formData === "function") {
            ({ session } = await authenticate.admin(requestOrCtx));
            formData = await requestOrCtx.formData();
        } else {
            session = requestOrCtx.session;
            formData = requestOrCtx.formData;
        }

        if (!session || !formData) {
            return { ok: false, error: "Invalid Q&A action request." };
        }

        const shop = normalizeShopDomain(session.shop);
        const intent = formData.get("_intent");
        const questionId = formData.get("questionId");
        const targetShops = await getGroupShopList(shop);

        if (!questionId) {
            return { ok: false, error: "Missing question." };
        }

        const existing = await db.QuestionAndAnswer.findFirst({
            where: { id: questionId, shop: { in: targetShops } },
        });
        if (!existing) {
            return { ok: false, error: "Question not found." };
        }

        if (intent === "reply" || intent === "editReply") {
            const reply = formData.get("reply");
            const trimmed = typeof reply === "string" ? reply.trim() : "";
            if (!trimmed) return { ok: false, error: "Reply cannot be empty." };

            await db.QuestionAndAnswer.update({
                where: { id: questionId },
                data: { reply: trimmed, replyDate: new Date(), replyPublished: true, status: "ANSWERED" },
            });
            return { ok: true, questionId, reply: trimmed };
        }

        if (intent === "unpublish") {
            await db.QuestionAndAnswer.update({
                where: { id: questionId },
                data: { replyPublished: false },
            });
            return { ok: true, questionId, intent };
        }

        return { ok: false, error: "Unknown action." };
    } catch (error) {
    console.error("[qa-management] action failed:", error);
    return { ok: false, error: "Something went wrong. Please try again in a moment." };
}
}
