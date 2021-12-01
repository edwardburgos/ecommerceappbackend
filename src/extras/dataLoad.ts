import queries from "./queries";
import { sequelizeObject } from "../db";
import fs from 'fs';
import { CategoryType, CountryType, SlideType, CategoryProductType, CountryStates, ProductPhotoType, CategoryCategoryType, CategoryCategoryCategoryType, StatesType } from "./types";

const { conn } = sequelizeObject;
const { product, category, photo, country, slide, state, category_product, product_photo, company, category_child, category_children_child } = sequelizeObject.models;

export default async function dataLoad() {
    try {

        console.log('Executing queries ...') 

        await Promise.all(queries.map(e => {
            return conn.query(`ALTER TABLE category_children ADD CONSTRAINT no_repeated_categories CHECK ("categoryId" != "CategoryChildId")`)
        }))

        console.log('Queries executed')

        console.log('Loading data ...')

        // Insert data
        const data = fs.readFileSync('./src/extras/data.json', 'utf8')
        let initialData = JSON.parse(data)

        // Photos
        const photos = await photo.bulkCreate(initialData.photos.map((e: string) => { return { url: e } }));
        const photosId = photos.map(e => e.getDataValue('id'))

        // Categories
        const categories = await category.bulkCreate(initialData.categories.map((e: CategoryType) => { return { name: e.name, photoId: e.photoId ? photosId[e.photoId - 1] : null, level: e.level } }));
        const categoriesId = categories.map(e => e.getDataValue('id'))

        // Products
        const products = await product.bulkCreate(initialData.products);
        const productsId = products.map(e => e.getDataValue('id'))

        // Categories & Products
        initialData.category_product.forEach(async (e: CategoryProductType) => {
            const categoryFound = await category.findOne({ where: { id: categoriesId[e.categoryId - 1] } })
            const productFound = await product.findOne({ where: { id: productsId[e.productId - 1] } })
            categoryFound && productFound ? category_product.create({ categoryId: categoriesId[e.categoryId - 1], productId: productsId[e.productId - 1] }) : null
        })

        // Products & Photos
        initialData.product_photo.forEach(async (e: ProductPhotoType) => {
            const productFound = await product.findOne({ where: { id: productsId[e.productId - 1] } })
            const photoFound = await photo.findOne({ where: { id: photosId[e.photoId - 1] } })
            productFound && photoFound ? product_photo.create({ productId: productsId[e.productId - 1], photoId: photosId[e.photoId - 1] }) : null
        })

        // Slides
        await slide.bulkCreate(initialData.slides.map((e: SlideType) => { return { name: e.name, position: e.position, photoId: photosId[e.photoId - 1] } }));

        // Company
        await company.create({...initialData.company, photoId: photosId[initialData.company.photoId - 1] })

        // categories & categories into category_children
        const category_children_created = await Promise.all(initialData.category_children.map((e: CategoryCategoryType) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const firstCategoryFound = await category.findOne({ where: { id: categoriesId[e.categoryId - 1] } })
                    const secondCategoryFound = await category.findOne({ where: { id: categoriesId[e.CategoryChildId - 1] } })
                    if (firstCategoryFound && secondCategoryFound) {
                        const firstCategoryLevel = firstCategoryFound.getDataValue('level')
                        const secondCategoryLevel = secondCategoryFound.getDataValue('level')
                        if (['1', '2'].includes(firstCategoryLevel) && ['1', '2'].includes(secondCategoryLevel) && firstCategoryLevel !== secondCategoryLevel) {
                            const categorychildCreated = await category_child.create({ categoryId: categoriesId[e.categoryId - 1], CategoryChildId: categoriesId[e.CategoryChildId - 1] })
                            resolve(categorychildCreated.getDataValue('id'))
                        }
                    }
                } catch (e) {
                    reject(e)
                }
            })
        }))

        // category_children & categories into category_children_children
        await Promise.all(initialData.category_children_children.map((e: CategoryCategoryCategoryType) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const compositeCategoryFound = await category_child.findOne({ where: { id: category_children_created[e.category_children - 1] } })
                    const thirdLevelCategoryFound = await category.findOne({ where: { id: categoriesId[e.category_children_childrenId - 1] } })
                    if (compositeCategoryFound && thirdLevelCategoryFound) {
                        const thirdLevelCategoryFoundLevel = thirdLevelCategoryFound.getDataValue('level')
                        if (thirdLevelCategoryFoundLevel === '3') {
                            await category_children_child.create({ categoryId: categoriesId[e.category_children_childrenId - 1], categoryChildId: category_children_created[e.category_children - 1] })
                            resolve('Completed')
                        }
                    }
                } catch (e) {
                    reject(e)
                }
            })
        }))

        // Insert countries
        const countries = JSON.parse(fs.readFileSync('./src/extras/countries.json', 'utf8'))
        await country.bulkCreate(countries.map((e: CountryType) => { return { name: e.name_es, code: e.code, dial_code: e.dial_code } }));

        // Insert states
        const states = JSON.parse(fs.readFileSync('./src/extras/countryStates.json', 'utf-8'))
        await Promise.all(states.map((e: StatesType) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const countryRecord = await country.findOne({ where: { code: e.code } })
                    if (countryRecord) {
                        const countryId = countryRecord.getDataValue("id");
                        await Promise.all(e.states.map((e: CountryStates) => {
                            return new Promise(async (resolve, reject) => {
                                try {
                                    await state.create({ name: e.name, code: e.state_code, countryId })
                                    resolve('Completed')
                                } catch (e) {
                                    reject(e)
                                }
                            })
                        }))
                        resolve('Completed')
                    }
                } catch (e) {
                    reject(e)
                }
            })
        }))

        console.log('Data loaded')

    } catch (e) {
        console.log(e)
    }
}