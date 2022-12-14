import { Product } from "../../models";
import multer from "multer";
import path from 'path';
import CustomErrorHandler from "../../services/CustomErrorHandler";
import Joi from 'joi';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const handleMultiPartData = multer({ storage, limits: { fileSize: 1000000 * 5 } }).single('image');

const productController = {
    async store(req, res, next) {

        // Multipart form Data 
        handleMultiPartData(req, res, async (err) => {
            if (err) {
                return next(CustomErrorHandler.serverError(err.message));
            }

            const filePath = req.file.path;
            const productSchema = Joi.object({
                name: Joi.string().required(),
                price: Joi.number().required(),
                size: Joi.string().required()
            });
            
            const { error } = productSchema.validate(req.body);
            if (error) {
                // Delete the file uploaded if error
                fs.unlink(`${appRoot}/${filePath}`, (error) => {
                    if(error){
                        return next(CustomErrorHandler.serverError(error));
                    }
                });

                return next(error);
            }

            const { name, price, size } = req.body;
            let document;
            try {
                document = await Product.create({ name, price, size, image: filePath });
            } catch (err) {
                return next(err);
            }

            res.status(201).json(document);
        });

    }
};

export default productController;