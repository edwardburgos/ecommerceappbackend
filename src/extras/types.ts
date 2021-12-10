export type CategoryType = {
    name: string,
    photoId: number,
    level: string,
    url: string,
    order: number
}

export type ProductSimpleType = {
    id: string,
    name: string,
    url: string,
    price: number,
    currency: string,
}

export type ProductCompleteType = {
    id: string,
    name: string,
    url: string,
    description: string | null,
    price: number,
    currency: string,
    stars: number | null
}

export type CategoryProductType = {
    categoryId: number;
    productId: number;
}

export type ProductPhotoType = {
    productId: number;
    photoId: number,
    order: number;
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
    id: string,
    categoryId: number,
    CategoryChildId: number,
    order: number
}

export type CompanyType = {
    business_name: string,
    ruc: string,
    brand: string
}

export type CategoryCategoryCategoryType = {
    category_children: number,
    category_children_childrenId: number,
    order: number
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

export type QueryResult = {
    command: string,
    rowCount: number
}