const jwt = require('jsonwebtoken');
const db = require('../pgdb/pgHelp')

class TokenService {

    generateTokens(payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS, {expiresIn: '30m'})
        const refreshToken  = jwt.sign(payload, process.env.JWT_REFRESH, {expiresIn: '30d'})

        return {
            accessToken,
            refreshToken
        }
    }

    validateAccessToken(token) {
        try {
            const userData = jwt.verify(token, process.env.JWT_ACCESS);
            return userData;
        } catch (error) {
            return null;
        }
    }
    validateRefreshToken(token) {
        try {
            const userData = jwt.verify(token, process.env.JWT_REFRESH);
            return userData;
        } catch (error) {
            return null;
        }
    }

    async saveToken(user_id, refreshToken) {
        const tokenData = await db.query(`
            SELECT * FROM tokens where user_id = ${user_id}
        `)
    
        if (tokenData.rowCount !== 0) {
            await db.query(`
                UPDATE tokens SET refreshtoken = '${refreshToken}', updated_at = NOW() WHERE user_id = ${user_id}
            `)
        } else {
            await db.query(`
                INSERT INTO tokens (user_id, refreshtoken, created_at, updated_at) 
                VALUES (${user_id}, '${refreshToken}', NOW(), NOW())
            `)
        }
    }

    async removeToken(refreshToken){
        const tokenData = await db.query(`
            DELETE FROM tokens WHERE refreshtoken = '${refreshToken}';
        `)
        return(tokenData)
    }

    async findToken(refreshToken){
        const tokenData = await db.query(`
            SELECT * FROM tokens WHERE refreshtoken = '${refreshToken}';
        `)
        return(tokenData)
    } 

    
}


module.exports = new TokenService();