export { };

if (typeof window !== 'undefined' && !window.crypto.randomUUID) {
    window.crypto.randomUUID = function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
        const template = '10000000-1000-4000-8000-100000000000';
        return template.replace(/[018]/g, (c) => {
            const num = Number(c);
            const random = window.crypto.getRandomValues(new Uint8Array(1))[0];
            return ((num ^ (random & (15 >> (num / 4)))).toString(16)) as string;
        }) as `${string}-${string}-${string}-${string}-${string}`;
    };
}