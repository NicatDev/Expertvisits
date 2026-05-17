import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Heading2,
    Heading3,
    Heading4,
    List,
    ListOrdered,
    Quote,
    Strikethrough,
    Code,
    SquareCode,
    Minus,
    Link2,
    Unlink,
} from 'lucide-react';
import styles from './style.module.scss';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/i18n/client';

function normalizeEditorLinkUrl(raw) {
    const u = (raw || '').trim();
    if (!u) return '';
    if (/^(https?:\/\/|mailto:)/i.test(u)) return u;
    if (u.startsWith('/')) return u;
    return `https://${u}`;
}

const LinkControl = ({ editor }) => {
    const { t } = useTranslation('common');
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const openEditor = () => {
        const prev = editor.getAttributes('link').href || '';
        setUrl(prev);
        setOpen(true);
    };

    const applyLink = () => {
        const href = normalizeEditorLinkUrl(url);
        if (!href) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
        }
        setOpen(false);
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setUrl('');
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyLink();
        }
        if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div ref={wrapRef} className={styles.linkWrap}>
            <button
                type="button"
                onClick={openEditor}
                className={editor.isActive('link') ? styles.active : ''}
                title={t('create_modal.editor_link')}
                aria-expanded={open}
            >
                <Link2 size={18} />
            </button>
            {open ? (
                <div className={styles.linkPopover} role="dialog" aria-label={t('create_modal.editor_link')}>
                    <input
                        type="url"
                        className={styles.linkInput}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={t('create_modal.editor_link_placeholder')}
                        autoFocus
                    />
                    <div className={styles.linkActions}>
                        <button type="button" className={styles.linkApply} onClick={applyLink}>
                            {t('create_modal.editor_link_apply')}
                        </button>
                        {editor.isActive('link') ? (
                            <button type="button" className={styles.linkRemove} onClick={removeLink} title={t('create_modal.editor_link_remove')}>
                                <Unlink size={16} />
                            </button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

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
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? styles.active : ''}
                title="Strikethrough"
            >
                <Strikethrough size={18} />
            </button>
            <div className={styles.divider} />
            <LinkControl editor={editor} />
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
            <div className={styles.divider} />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? styles.active : ''}
                title="Bullet list"
            >
                <List size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? styles.active : ''}
                title="Numbered list"
            >
                <ListOrdered size={18} />
            </button>
            <div className={styles.divider} />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? styles.active : ''}
                title="Quote"
            >
                <Quote size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? styles.active : ''}
                title="Inline code"
            >
                <Code size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? styles.active : ''}
                title="Code block"
            >
                <SquareCode size={18} />
            </button>
            <div className={styles.divider} />
            <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal line"
            >
                <Minus size={18} />
            </button>
        </div>
    );
};

const RichTextEditor = ({ content, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
            }),
            Heading.configure({
                levels: [2, 3, 4],
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
            Placeholder.configure({
                placeholder: placeholder || '',
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: styles.editorContent,
            },
        },
    });

    useEffect(() => {
        if (editor && content !== undefined) {
            const currentHtml = editor.getHTML();
            if (content !== currentHtml) {
                if (content === '' || content === '<p></p>') {
                    editor.commands.setContent(content);
                } else if (editor.getText() === '') {
                    editor.commands.setContent(content);
                }
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
