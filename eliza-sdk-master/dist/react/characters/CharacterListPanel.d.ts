export interface CharacterListPanelProps {
    /** Callback when a character is selected */
    onPick: (characterId: string) => void;
    /** Currently selected character ID */
    selectedId?: string | null;
    /** Optional NFT collection ID to filter characters */
    nftCollectionId?: string;
    /** Custom class name for the container */
    className?: string;
}
export declare function CharacterListPanel(props: CharacterListPanelProps): JSX.Element;
