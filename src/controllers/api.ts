import { Application, Request, Response } from "express";
import { sequelizeObject } from '../db';

export const loadApiEndpoints = (app: Application): void => {
  app.get("/api", async (req: Request, res: Response) => {
    try {
      const administradores = await sequelizeObject.models.administradores.findAll();
    console.log(administradores)
    } catch (e) {
      console.log('Se produjo el siguiente error', e)
    }
  //   const administradores = await sequelizeObject.findAll({
  //     // attributes: ['id', 'name', 'image'],
  //     // include: [
  //     //     {
  //     //         model: Temperament,
  //     //         as: "temperaments",
  //     //         attributes: ["id", "name"]
  //     //     },
  //     // ],
  //     // order: [ [ 'name', 'asc' ] ]
  // });
    return res.status(200).send('Respuesta');
  });
};
