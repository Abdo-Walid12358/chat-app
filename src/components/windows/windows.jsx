import "./windows.css";

export default function Windows({ children, className }){
    return(
        <>
            <section className={`windows ${className}`}>
                {children}
            </section>
        </>
    )
}