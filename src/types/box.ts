export interface Box {
    id: string;
    name: string;
    ownerUid: string; // UID of the admin/owner
    address?: string; // Optional physical address
    createdAt: string;
}
