import 'jest';
import {Pool, types} from 'pg';

test('count', async () => {
    const pool = new Pool({
        host: 'localhost',
        database: 'postgres',
    });

    types.setTypeParser(1700, parseFloat);
    types.setTypeParser(20, BigInt);

    (BigInt.prototype as any).toJSON = function() {
        return this.toString();
    };

    const connection = await pool.connect();

    {
        const count = (await connection.query('SELECT 1.55 as count')).rows[0].count;
        expect(count).toBe(1.55);
    }

    {
        const count = (await connection.query('SELECT COUNT(*) as count FROM "user"')).rows[0].count;
        expect(count).toBe(0n);
    }
});