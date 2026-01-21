import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import { Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3, Heading4 } from 'lucide-react';
import styles from './style.module.scss';
import { useEffect } from 'react';

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className={styles.menuBar}>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? styles.active : ''}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? styles.active : ''}
                title="Italic"
            >
                <Italic size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? styles.active : ''}
                title="Underline"
            >
                <UnderlineIcon size={18} />
            </button>
            <div className={styles.divider} />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
                title="Heading 2"
            >
                <Heading2 size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? styles.active : ''}
                title="Heading 3"
            >
                <Heading3 size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                className={editor.isActive('heading', { level: 4 }) ? styles.active : ''}
                title="Heading 4"
            >
                <Heading4 size={18} />
            </button>
        </div>
    );
};

const RichTextEditor = ({ content, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Disable default heading to use configured one
            }),
            Heading.configure({
                levels: [2, 3, 4],
            }),
            Underline,
        ],
        content: content,
        immediatelyRender: false, // Fix hydration mismatch
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: styles.editorContent,
            },
        },
    });

    // Update content if it changes externally (e.g. initial load)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if difference is significant to avoid cursor jumps
            if (editor.getText() === '' && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);


    return (
        <div className={styles.richTextEditor}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className={styles.contentArea} />
        </div>
    );
};

export default RichTextEditor;
