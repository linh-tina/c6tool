declare module "@vntk/dictionary" {
  interface Dictionary {
    readonly words: string[];
    readonly lower_words: string[];
    has(word: string): boolean;
    lookup(word: string): unknown;
  }

  const dictionary: Dictionary;
  export default dictionary;
}
