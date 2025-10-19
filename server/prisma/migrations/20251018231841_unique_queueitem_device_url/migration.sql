/*
  Warnings:

  - A unique constraint covering the columns `[device_id,tiktok_url]` on the table `queue_item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "queue_item_device_id_tiktok_url_key" ON "queue_item"("device_id", "tiktok_url");
