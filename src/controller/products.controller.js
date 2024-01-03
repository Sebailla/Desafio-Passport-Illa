import { request, response } from "express"
import { addProductServices, deleteProductServices, getProductByCodeServices, getProductByIdServices, getProductsServices, updateProductServices } from "../services/products.js"
import { cloudinary } from "../config/cloudinary.config.js"
import { validFileExtension } from "../utils.js"

//Todo:       CONTROLADORES

export const getProducts = async (req = request, res = response) => {
    try {
        const result = await getProductsServices({ ...req.query })
        return res.json({ result })
    } catch (error) {
        return res.status(500).json({ status: 'Error en servidor' })
    }
}

export const getProductById = async (req = request, res = response) => {
    try {
        const { pid } = req.params
        const result = await getProductByIdServices(pid)
        if (result) {
            return res.json({ result })
        } else {
            return res.status(404).json({ msg: `El producto con ID: ${pid}, no está en existencia` })
        }
    } catch (error) {
        return res.status(500).json({ msg: 'Error en servidor' })
    }
}

export const addProduct = async (req = request, res = response) => {
    try {
        const { title, description, price, thumbnail, code, stock, category, status } = req.body
        if (!title, !description, !price, !code, !stock, !category) {
            return res.status(404).json({ msg: 'Faltan Campos Obligatorios' })
        }
        const verifiedCode = await getProductByCodeServices(code)
        if (verifiedCode) {
            return res.status(400).json({ msg: 'El Código ya existe'})
        }
        if(req.file){
            const isValidExtension = validFileExtension(req.file.originalname)
            if(!isValidExtension) {
                return res.status(400).json({ msg: 'Formato no corresponde a imagen, solo se permiten los siguientes formatos: .png, .jpg y . jpeg'})
            }
            const {secure_url} = await cloudinary.uploader.upload(req.file.path)
            req.body.thumbnail = secure_url
        }
        //const result = await addProductServices({ ...req.body })
        await addProductServices({ ...req.body })
        //return res.json({ result })
        return res.redirect('/products')

    } catch (error) {
        return res.status(500).json({ msg: 'Error en servidor' })
    }
}

export const updateProduct = async (req = request, res = response) => {
    try {
        const { pid } = req.params
        const { _id, ...rest } = req.body
        const product = await getProductByIdServices(pid)

        if(!product) {
            return res.status(400).json({ msg: `El Producto con Id: ${pid}, no se encuentra en existencia` })
        }

        if (req.file) {
            const isValidExtension = validFileExtension(req.file.originalname)
            if(!isValidExtension) {
                return res.status(400).json({ msg: 'Formato no corresponde a imagen, solo se permiten los siguientes formatos: .png, .jpg y . jpeg'})
            }
            if (product.thumbnail) {
                //elimina imagen y reemplaza por una nueva
                const imgUrl = product.thumbnail.split('/')
                const img = imgUrl[imgUrl.length - 1]
                const [imgId] = img.split('.')
                cloudinary.uploader.destroy(imgId)
            }
            const { secure_url } = await cloudinary.uploader.upload(req.file.path)
            rest.thumbnail = secure_url
        }

        const result = await updateProductServices(pid, rest)
        if (result) {
            return res.json({ msg: 'Producto actualizado correctamente', result })
        } else {
            return res.status(404).json({ msg: `El producto con Id: ${pid}, no se pudo actualizar` })
        }
    } catch (error) {
        return res.status(500).json({ msg: 'Error en servidor' })
    }
}

export const deleteProduct = async (req = request, res = response) => {
    try {
        const { pid } = req.params
        const result = await deleteProductServices(pid)
        if (result) {
            return res.json({ msg: 'Producto eliminado correctamente', result })
        } else {
            return res.status(404).json({ msg: `El producto con Id: ${pid}, no se pudo eliminar` })
        }
    } catch (error) {
        return res.status(500).json({ msg: 'Error en servidor' })
    }
}

