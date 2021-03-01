import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Teams } from './teams.entity';

@Index('user___fk_team_id', ['teamId'], {})
@Entity('users', { schema: 'crusher' })
export class Users {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('int', { name: 'team_id', nullable: true })
  teamId: number | null;

  @Column('varchar', { name: 'first_name', length: 30 })
  firstName: string;

  @Column('varchar', { name: 'last_name', length: 30 })
  lastName: string;

  @Column('varchar', { name: 'email', length: 50 })
  email: string;

  @Column('text', { name: 'password', nullable: true })
  password: string | null;

  @Column('tinyint', { name: 'verified', width: 1, default: () => "'0'" })
  verified: boolean;

  @Column('timestamp', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('timestamp', {
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // @OneToOne(() => Alerting, (alerting) => alerting.user)
  // alerting: Alerting;
  //
  // @OneToMany(() => Comments, (comments) => comments.user)
  // comments: Comments[];
  //
  // @OneToMany(() => Jobs, (jobs) => jobs.user)
  // jobs: Jobs[];
  //
  // @OneToMany(
  //   () => MonitoringSettings,
  //   (monitoringSettings) => monitoringSettings.user,
  // )
  // monitoringSettings: MonitoringSettings[];
  //
  // @OneToMany(() => ProjectHosts, (projectHosts) => projectHosts.user)
  // projectHosts: ProjectHosts[];
  //
  // @OneToMany(
  //   () => TestInstanceResults,
  //   (testInstanceResults) => testInstanceResults.actionBy2,
  // )
  // testInstanceResults: TestInstanceResults[];
  //
  // @OneToMany(() => Tests, (tests) => tests.user)
  // tests: Tests[];
  //
  // @OneToMany(() => UserMeta, (userMeta) => userMeta.user)
  // userMetas: UserMeta[];
  //
  // @OneToMany(
  //   () => UserProjectRoles,
  //   (userProjectRoles) => userProjectRoles.user,
  // )
  // userProjectRoles: UserProjectRoles[];
  //
  // @OneToMany(
  //   () => UserProviderConnections,
  //   (userProviderConnections) => userProviderConnections.user,
  // )
  // userProviderConnections: UserProviderConnections[];
  //
  // @OneToMany(() => UserTeamRoles, (userTeamRoles) => userTeamRoles.user)
  // userTeamRoles: UserTeamRoles[];

  @ManyToOne(() => Teams, (teams) => teams.users, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'team_id', referencedColumnName: 'id' }])
  team: Teams;
}
