export interface Project {
	projectId: string;
	displayName: string;
}

export interface ProjectDatabases {
	databaseIds: string[];
	warning: string | null;
}
