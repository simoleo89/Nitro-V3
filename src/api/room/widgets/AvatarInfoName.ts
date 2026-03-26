export class AvatarInfoName
{
    public prefixText: string = '';
    public prefixColor: string = '';
    public prefixIcon: string = '';
    public prefixEffect: string = '';

    constructor(
        public readonly roomIndex: number,
        public readonly category: number,
        public readonly id: number,
        public readonly name: string,
        public readonly userType: number,
        public readonly isFriend: boolean = false)
    {}
}
