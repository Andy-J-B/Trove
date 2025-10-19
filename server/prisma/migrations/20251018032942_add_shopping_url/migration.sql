-- AlterTable
ALTER TABLE "product" ADD COLUMN     "mentioned_content" TEXT;

-- CreateTable
CREATE TABLE "shopping_url" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_url_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopping_url_product_id_idx" ON "shopping_url"("product_id");

-- AddForeignKey
ALTER TABLE "shopping_url" ADD CONSTRAINT "shopping_url_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
