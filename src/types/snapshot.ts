
export interface SnapshotType {
  id: string;
  name: string;
  description: string;
  create_time: string | null;
  state: string | null;
  children?: SnapshotType[];
}
