import { Seeder } from '@strav/database'
import AccountSeeder from './account_seeder.ts'

export default class DatabaseSeeder extends Seeder {
  async run(): Promise<void> {
    await this.call(AccountSeeder)
  }
}
