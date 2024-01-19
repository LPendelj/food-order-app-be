import {Router} from 'express'; 
import { sample_users } from '../data';
import jwt from "jsonwebtoken";
import asyncHandler from 'express-async-handler'
import { User, UserModel } from '../models/user.model';
import { HTTP_BAD_REQUEST } from '../constants/http_status';
import bcrypt from 'bcryptjs';

const router = Router();

router.get("/seed", asyncHandler(
    async (req, res) =>{
        const usersCount = await UserModel.countDocuments();
        if(usersCount > 0){
            res.send("Seed already done")
            return
        }

        await UserModel.create(sample_users)
        res.send("Seed is done")
    }
))

router.post("/login", asyncHandler(
    async (req, res) => {
        const {email, password} = req.body;
        const user = await UserModel.findOne({
            email
        })
        // stari nacin filtriranja dok nije bilo baze.
        //sample_users.find(user => user.email === email && user.password === password);
    
        if(user && (await bcrypt.compare(password,user.password))){
            res.send(generateToken(user))
        } else {
            res.status(HTTP_BAD_REQUEST).send("Username or Password are not valid")
        }
    }
))

router.post("/register", asyncHandler(
    async (req, res) =>{
        const { name, email, password, address } = req.body;
        const user = await UserModel.findOne({email});
        if(user){
            res.status(HTTP_BAD_REQUEST).send('User already exists. Please login!')
            return
        }

        const encryptedPassword = await bcrypt.hash(password, 10);
        const newUser: User = {
            id: '',
            name,
            email: email.toLowerCase(),
            address,
            isAdmin: false,
            password: encryptedPassword
        }

        const dbUser = await UserModel.create(newUser);

        res.send(generateToken(dbUser));
    }
))

const generateToken = (user:User) => {
    const token = jwt.sign(
        {   
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin
        },
        "SomeRandomText",
        {
            expiresIn: "30d"
        }
    )
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        address: user.address,
        isAdmin: user.isAdmin,
        token: token
      };
} 


export default router;