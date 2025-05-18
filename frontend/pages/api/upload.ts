import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export const config = {
    api: {
        bodyParser: false, // Disable default body parser to handle file uploads
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => {
            chunks.push(chunk);
        });

        req.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const uploadDir = path.join(process.cwd(), "uploads");

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }

            const filePath = path.join(uploadDir, "uploaded-video.mp4");
            fs.writeFileSync(filePath, buffer);

            res.status(200).json({ fileUrl: `/uploads/uploaded-video.mp4` });
        });
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}