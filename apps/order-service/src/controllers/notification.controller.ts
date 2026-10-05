//Path: apps/order-service/src/controllers/notification.controller.ts
//a notification row is addressed to one account: recieverId is a user id or a seller id (both are ObjectIds).
//Everything here is scoped to the signed-in caller, whichever kind of account they are.
import { NextFunction, Response } from "express";
import prisma from "@packages/libs/prisma";
import { AuthError, NotFoundError, ValidationError } from "@packages/error-handler";

const callerId = (req: any): string => {
  const id = req.user?.id ?? req.seller?.id;
  if (!id) throw new AuthError("Not signed in.");
  return id;
};

export const getNotifications = async (req: any, res: Response, next: NextFunction) => {
  try {
    const recieverId = callerId(req);
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notifications.findMany({ where: { recieverId }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.notifications.count({ where: { recieverId } }),
      prisma.notifications.count({ where: { recieverId, status: "Unread" } }),
    ]);
    res.status(200).json({ success: true, notifications, unreadCount, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const recieverId = callerId(req);
    const id = String(req.params.id ?? "");
    if (!/^[0-9a-f]{24}$/i.test(id)) throw new ValidationError("Invalid notification id.");
    //matching on recieverId too means nobody can touch someone else's notification
    const result = await prisma.notifications.updateMany({ where: { id, recieverId }, data: { status: "Read" } });
    if (result.count === 0) throw new NotFoundError("Notification not found.");
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const recieverId = callerId(req);
    const result = await prisma.notifications.updateMany({ where: { recieverId, status: "Unread" }, data: { status: "Read" } });
    res.status(200).json({ success: true, updated: result.count });
  } catch (err) {
    next(err);
  }
};
