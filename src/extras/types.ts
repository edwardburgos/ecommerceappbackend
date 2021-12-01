export type CategoryType = {
    name: string,
    photoId: number,
    level: string
}

export type ProductType = {
    name: string;
    categoryId: number;
    id: string;
}

export type CategoryProductType = {
    categoryId: number;
    productId: number;
}

export type ProductPhotoType = {
    productId: number;
    photoId: number;
}

export type PhotoType = {
    url: string,
    categoryId?: number,
    productId?: number,
    slideId?: number
}

export type CountryType = {
    name_es: string,
    name_en: string,
    dial_code: string,
    code: string
}

export type SlideType = {
    name: string,
    position: number,
    photoId: number
}

export type ReturnedSlideType = {
    id: string,
    name: string,
    position: number,
    photo: string
}

export type CategoryCategoryType = {
    categoryId: number,
    CategoryChildId: number
}

export type CompanyType = {
    business_name: string,
    ruc: string,
    brand: string
}

export type CategoryCategoryCategoryType = {
    category_children: number,
    category_children_childrenId: number
}

export type CountryStates = {
    name: string,
    state_code: string
}

export type StatesType = {
    name: string,
    code: string,
    states: CountryStates[]
}