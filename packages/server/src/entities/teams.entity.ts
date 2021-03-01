import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from './users.entity';
// import { Projects } from './Projects';
// import { UserTeamRoles } from './UserTeamRoles';
// import { Users } from './Users';

@Entity('teams', { schema: 'crusher' })
export class Teams {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @Column('varchar', { name: 'team_email', nullable: true, length: 255 })
  teamEmail: string | null;

  @Column('enum', {
    name: 'tier',
    enum: ['FREE', 'STARTER', 'PRO'],
    default: () => "'FREE'",
  })
  tier: 'FREE' | 'STARTER' | 'PRO';

  @Column('timestamp', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column('timestamp', {
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column('varchar', {
    name: 'stripe_customer_id',
    nullable: true,
    length: 100,
  })
  stripeCustomerId: string | null;
  //
  // @OneToMany(() => Projects, (projects) => projects.team)
  // projects: Projects[];
  //
  // @OneToMany(() => UserTeamRoles, (userTeamRoles) => userTeamRoles.team)
  // userTeamRoles: UserTeamRoles[];
  //
  @OneToMany(() => Users, (users) => users.team)
  users: Users[];
}
