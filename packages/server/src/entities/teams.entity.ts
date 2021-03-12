import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from './users.entity';
import { ApiProperty } from '@nestjs/swagger';
// import { Projects } from './Projects';
// import { UserTeamRoles } from './UserTeamRoles';
// import { Users } from './Users';

@Entity('teams', { schema: 'crusher' })
export class Teams {
  @ApiProperty()
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @ApiProperty()
  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @ApiProperty()
  @Column('varchar', { name: 'team_email', nullable: true, length: 255 })
  teamEmail: string | null;

  @ApiProperty()
  @Column('enum', {
    name: 'tier',
    enum: ['FREE', 'STARTER', 'PRO'],
    default: () => "'FREE'",
  })
  tier: 'FREE' | 'STARTER' | 'PRO';

  @ApiProperty()
  @Column('timestamp', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ApiProperty()
  @Column('timestamp', {
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ApiProperty()
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

  @ApiProperty()
  @OneToMany(() => Users, (users) => users.team)
  users: Users[];
}
